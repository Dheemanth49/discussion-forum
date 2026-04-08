package com.forum.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
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

    @Value("${gemini.api.fallback-url:}")
    private String geminiFallbackUrl;

    private final RestTemplate restTemplate;

    public AiService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateSummary(String prompt) {
        // Try Primary URL
        String result = generateSummaryInternal(geminiApiUrl, prompt, false);
        
        // If primary fails or returns error msg, try Fallback if available
        if ((result == null || result.startsWith("Summary generation failed")) && geminiFallbackUrl != null && !geminiFallbackUrl.isBlank()) {
            log.warn("Primary API failed, trying fallback...");
            result = generateSummaryInternal(geminiFallbackUrl, prompt, false);
        }
        
        return result != null ? result : "Summary generation failed. Primary and fallback services are unavailable.";
    }

    private String generateSummaryInternal(String apiUrl, String prompt, boolean isRetry) {
        try {
            String url = apiUrl + "?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String formattedPrompt = """
                    You are an AI assistant summarizing a technical discussion thread.
                    
                    TASK: Generate a COMPLETE, detailed, and structured summary.
                    
                    STRICT RULES:
                    1. LENGTH: Exactly 200-300 words.
                    2. STRUCTURE: 
                       - Overview of the problem.
                       - Key arguments and solutions proposed.
                       - Final conclusion or consensus.
                    3. COMPLETENESS: Never stop mid-sentence. If you are reaching the token limit, conclude the sentence gracefully.
                    4. TONE: Professional and objective.
                    
                    DISCUSSION DATA:
                    """ + prompt;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", formattedPrompt)))),
                    "generationConfig", Map.of(
                            "temperature", 0.7,
                            "maxOutputTokens", 1024));

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                    if (content != null && content.containsKey("parts")) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (!parts.isEmpty()) {
                            String text = (String) parts.get(0).get("text");
                            if (text != null && !text.isBlank()) {
                                text = text.trim();
                                
                                // Retry logic for short summaries
                                if (text.length() < 200 && !isRetry) {
                                    log.warn("Summary too short ({} chars), retrying with more focus...", text.length());
                                    return generateSummaryInternal(apiUrl, prompt + "\n\nPLEASE PROVIDE MORE DETAIL. THE PREVIOUS SUMMARY WAS TOO SHORT.", true);
                                }
                                
                                // Ensure it doesn't end abruptly
                                if (!text.endsWith(".") && !text.endsWith("!") && !text.endsWith("?")) {
                                    text += " [Summary concludes here]";
                                }
                                
                                return text;
                            }
                        }
                    }
                }
            }
            return "Summary generation failed: Unexpected response structure.";
        } catch (Exception e) {
            log.error("AI summarization failed at {}: {}", apiUrl, e.getMessage());
            return "Summary generation failed: " + e.getMessage();
        }
    }
}