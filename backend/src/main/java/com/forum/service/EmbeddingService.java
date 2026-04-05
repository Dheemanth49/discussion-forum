package com.forum.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@Slf4j
public class EmbeddingService {

    private final RestTemplate restTemplate;
    private final String embeddingServiceUrl;

    public EmbeddingService(@Value("${embedding.service.url}") String embeddingServiceUrl) {
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
}
