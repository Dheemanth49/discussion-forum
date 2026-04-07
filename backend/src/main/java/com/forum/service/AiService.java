package com.forum.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;

    public AiService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateSummary(String prompt) {
        return generateSummaryInternal(prompt, false);
    }

    private String generateSummaryInternal(String prompt, boolean isRetry) {
        try {
            String url = geminiApiUrl + "?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String formattedPrompt = """
You are an AI assistant summarizing a discussion thread.

Analyze the discussion and generate a COMPLETE, detailed summary.

STRICT INSTRUCTIONS:
- Minimum 6-8 sentences
- Do NOT stop mid-sentence
- Cover all major viewpoints
- Combine similar opinions
- Ensure clarity and completeness
- Avoid vague statements

OUTPUT FORMAT:
Summary:
<Write a full paragraph here>

Discussion:
""" + prompt;

            // 🔥 DEBUG: see what you're actually sending
            log.info("PROMPT SENT TO AI:\n{}", formattedPrompt);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", formattedPrompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.7,
                            "maxOutputTokens", 500
                    )
            );

            HttpEntity<Map<String, Object>> requestEntity =
                    new HttpEntity<>(requestBody, headers);

            log.info("Sending request to Gemini API...");

            ResponseEntity<Map> response;
            try {
                response = restTemplate.postForEntity(url, requestEntity, Map.class);
            } catch (HttpClientErrorException | HttpServerErrorException e) {
                log.error("Gemini API HTTP Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                return "Summary generation failed due to API error.";
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

                                // 🔥 RETRY IF TOO SHORT
                                if (text.length() < 80 && !isRetry) {
                                    log.warn("Summary too short, retrying...");
                                    return generateSummaryInternal(prompt, true);
                                }

                                return text;
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
}