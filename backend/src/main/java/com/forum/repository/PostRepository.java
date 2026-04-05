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
    Page<Post> searchPosts(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Post p ORDER BY p.upvotes DESC")
    Page<Post> findTrending(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE SIZE(p.comments) = 0")
    Page<Post> findUnanswered(Pageable pageable);

    long countByAuthorUserId(UUID userId);

    void deleteByAuthorUserId(UUID userId);
}
