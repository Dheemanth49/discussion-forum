package com.forum.repository;

import com.forum.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    Page<Post> findByCategoryCategoryId(Long categoryId, Pageable pageable);

    Page<Post> findByAuthorUserId(UUID userId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Post> searchPostsText(@Param("query") String query, Pageable pageable);

    @Query(value = "SELECT p.post_id, (1.0 - (p.embedding <=> CAST(:embedding AS vector))) as score " +
           "FROM posts p " +
           "WHERE p.embedding IS NOT NULL " +
           "ORDER BY score DESC",
           countQuery = "SELECT count(*) FROM posts WHERE embedding IS NOT NULL",
           nativeQuery = true)
    Page<Object[]> searchPostsSemantic(@Param("embedding") String embeddingString, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.createdAt >= :since ORDER BY p.upvotes DESC")
    Page<Post> findTrending(@Param("since") java.time.LocalDateTime since, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE SIZE(p.comments) = 0")
    Page<Post> findUnanswered(Pageable pageable);

    long countByAuthorUserId(UUID userId);

    void deleteByAuthorUserId(UUID userId);
}
