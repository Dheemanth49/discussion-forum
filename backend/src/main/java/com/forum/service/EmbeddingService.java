package com.forum.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class EmbeddingService {

    private final RestTemplate restTemplate;
    private final String embeddingServiceUrl;

    public EmbeddingService(@Value("${embedding.service.url:http://localhost:7860}") String embeddingServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.embeddingServiceUrl = embeddingServiceUrl;
    }

    /**
     * Calls the Python embedding service to generate and store
     * an embedding for the given post. The Python service handles
     * the actual embedding generation asynchronously in its own thread pool,
     * so this HTTP call returns almost instantly.
     */
    public void processPost(UUID postId) {
        try {
            String url = embeddingServiceUrl + "/process_post/" + postId.toString();
            log.info("Calling embedding service for post: {}", postId);

            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);

            log.info("Embedding service responded with status: {} for post: {}",
                    response.getStatusCode(), postId);
        } catch (Exception e) {
            // Log the error but don't fail the post creation
            log.error("Failed to call embedding service for post: {}. Error: {}",
                    postId, e.getMessage());
        }
    }

    /**
     * Calls the Python embedding service to generate an embedding for a search query.
     * Returns the array as a string format expected by pgvector: "[0.1, 0.2, ...]"
     */
    public String generateQueryEmbedding(String query) {
        try {
            String url = embeddingServiceUrl + "/generate_query_embedding";
            Map<String, String> request = Map.of("query", query);
            log.info("Requesting embedding for search query: {}", query);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Double> embeddingList = (List<Double>) response.getBody().get("embedding");
                if (embeddingList != null) {
                    return embeddingList.toString();
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate embedding for query. Error: {}", e.getMessage());
        }
        return null;
    }
}
