package com.forum.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.fallback-url:}")
    private String geminiFallbackApiUrl;

    private final RestTemplate restTemplate;
    private static final int MAX_API_RETRIES = 3;

    public AiService() {
        this.restTemplate = new RestTemplate();
        // Set timeouts for RestTemplate
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000); 
        factory.setReadTimeout(60000);    
        this.restTemplate.setRequestFactory(factory);
    }

    public String generateSummary(String prompt) {
        return generateSummaryInternal(prompt, false);
    }

    private String generateSummaryInternal(String prompt, boolean isRetry) {
        try {
            if (geminiApiKey == null || geminiApiKey.isBlank()) {
                log.error("Gemini API key is not configured");
                return "Summary generation is unavailable: missing AI configuration.";
            }
            List<String> candidateUrls = new ArrayList<>();
            if (geminiApiUrl != null && !geminiApiUrl.isBlank()) {
                candidateUrls.add(geminiApiUrl);
            }
            if (geminiFallbackApiUrl != null && !geminiFallbackApiUrl.isBlank()) {
                candidateUrls.add(geminiFallbackApiUrl);
            }
            if (candidateUrls.isEmpty()) {
                log.error("Gemini API URL is not configured");
                return "Summary generation is unavailable: missing AI endpoint configuration.";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String formattedPrompt = """
You are an expert discussion analyst.

TASK:
Read the full thread and produce a detailed, accurate summary of the discussion.
Focus strongly on what users discussed in comments.

STRICT REQUIREMENTS:
1) Be detailed and concrete (not generic).
2) Capture the main topic, key sub-topics, and user viewpoints.
3) Include areas of agreement and disagreement.
4) Mention repeated concerns/questions raised by multiple users.
5) If comments are weak or missing, state that explicitly.
6) Keep factual fidelity to the provided text only. Do not invent details.
7) Response must be complete and not cut off.

OUTPUT FORMAT (Markdown):
## Thread Summary
Write 8-12 clear sentences summarizing the post and the overall conversation.

## What Users Discussed
- 5-10 bullet points focused on user comments.
- Each bullet should describe one concrete theme/viewpoint/question from users.

## Consensus and Conflicts
- **Consensus:** <short paragraph>
- **Conflicts:** <short paragraph>

Thread data:
""" + prompt;

            log.debug("Prepared AI summary request payload");

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", formattedPrompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.45,
                            "maxOutputTokens", 1100
                    )
            );

            HttpEntity<Map<String, Object>> requestEntity =
                    new HttpEntity<>(requestBody, headers);

            log.info("Sending request to Gemini API");

            ResponseEntity<Map> response = null;
            HttpStatusCode lastStatus = null;
            String lastErrorBody = null;

            for (String baseUrl : candidateUrls) {
                String urlWithKey = baseUrl + "?key=" + geminiApiKey;
                for (int attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
                    try {
                        response = restTemplate.postForEntity(urlWithKey, requestEntity, Map.class);
                        break;
                    } catch (HttpClientErrorException | HttpServerErrorException e) {
                        lastStatus = e.getStatusCode();
                        lastErrorBody = e.getResponseBodyAsString();
                        boolean retryable = isRetryableStatus(e.getStatusCode());
                        boolean hasMoreAttempts = attempt < MAX_API_RETRIES;
                        log.warn("Gemini API attempt {}/{} failed with status {} (retryable={})",
                                attempt, MAX_API_RETRIES, e.getStatusCode(), retryable);

                        if (retryable && hasMoreAttempts) {
                            sleepQuietly(Duration.ofMillis(700L * attempt));
                            continue;
                        }
                        break;
                    }
                }

                if (response != null) {
                    break;
                }
            }

            if (response == null) {
                log.error("Gemini API failed after retries. status={}, body={}", lastStatus, lastErrorBody);
                if (lastStatus != null && (lastStatus.value() == 503 || lastStatus.value() == 429)) {
                    return "Summary service is temporarily busy. Please try again in a moment.";
                }
                return "Summary generation failed due to API error: " + (lastStatus != null ? lastStatus : "UNKNOWN");
            }

            Map<String, Object> body = response.getBody();

            if (body == null) {
                log.error("Gemini API returned null body");
                return "Summary generation failed: Empty response.";
            }

            log.debug("Gemini response: {}", body);

            if (body.containsKey("candidates")) {
                List<Map<String, Object>> candidates =
                        (List<Map<String, Object>>) body.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> content =
                            (Map<String, Object>) firstCandidate.get("content");

                    if (content != null && content.containsKey("parts")) {
                        List<Map<String, Object>> parts =
                                (List<Map<String, Object>>) content.get("parts");

                        if (parts != null && !parts.isEmpty()) {
                            String text = (String) parts.get(0).get("text");

                            if (text != null && !text.isBlank()) {
                                text = text.trim();

                                if (countWords(text) < 120 && !isRetry) {
                                    log.warn("Summary too short ({} words), retrying for more detail...", countWords(text));
                                    return generateSummaryInternal(
                                            prompt + "\n\nIMPORTANT: Provide a detailed response with at least 180 words and include all requested sections.",
                                            true
                                    );
                                }

                                // Gemini can stop with MAX_TOKENS and return a cut-off sentence.
                                String finishReason = firstCandidate.get("finishReason") instanceof String
                                        ? (String) firstCandidate.get("finishReason")
                                        : "";
                                if ("MAX_TOKENS".equalsIgnoreCase(finishReason) && !isRetry) {
                                    log.warn("Summary was truncated by token limit; retrying once for complete output.");
                                    return generateSummaryInternal(prompt + "\n\nIMPORTANT: Ensure your response is complete and not truncated.", true);
                                }

                                return ensureCompleteSentence(text);
                            }
                        }
                    }
                }
            }

            log.error("Unexpected Gemini response structure: {}", body);
            return "Summary generation failed: Unexpected response.";

        } catch (Exception e) {
            log.error("AI summarization failed: {}", e.getMessage(), e);
            return "Summary generation failed. Please try again.";
        }
    }

    private boolean isRetryableStatus(HttpStatusCode statusCode) {
        int code = statusCode.value();
        return code == 429 || code == 500 || code == 502 || code == 503 || code == 504;
    }

    private void sleepQuietly(Duration duration) {
        try {
            Thread.sleep(duration.toMillis());
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private String ensureCompleteSentence(String text) {
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }

        // Keep structured markdown outputs intact (headings/bullets may not end with periods).
        if (trimmed.contains("\n##") || trimmed.contains("\n- ") || trimmed.contains("\n* ")) {
            return trimmed;
        }

        char lastChar = trimmed.charAt(trimmed.length() - 1);
        boolean complete = lastChar == '.' || lastChar == '!' || lastChar == '?' || lastChar == ')' || lastChar == '"';
        if (complete) {
            return trimmed;
        }
        int lastPeriod = Math.max(trimmed.lastIndexOf('.'), Math.max(trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?')));
        if (lastPeriod > 0) {
            return trimmed.substring(0, lastPeriod + 1);
        }
        return trimmed;
    }

    private int countWords(String text) {
        String cleaned = text == null ? "" : text.trim();
        if (cleaned.isEmpty()) {
            return 0;
        }
        return cleaned.split("\\s+").length;
    }
}