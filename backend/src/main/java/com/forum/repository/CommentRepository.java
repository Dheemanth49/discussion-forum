package com.forum.repository;

import com.forum.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByPostPostIdAndParentCommentIsNullOrderByCreatedAtDesc(UUID postId);
    List<Comment> findByPostPostIdOrderByCreatedAtAsc(UUID postId);
    long countByPostPostId(UUID postId);
    long countByAuthorUserId(UUID userId);

    @Query("SELECT c.post.postId, COUNT(c) FROM Comment c WHERE c.post.postId IN :postIds GROUP BY c.post.postId")
    List<Object[]> countCommentsByPostIds(@Param("postIds") List<UUID> postIds);

    void deleteByAuthorUserId(UUID userId);
}
