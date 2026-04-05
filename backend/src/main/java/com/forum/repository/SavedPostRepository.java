package com.forum.repository;

import com.forum.model.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {

    Optional<SavedPost> findByUserUserIdAndPostPostId(UUID userId, UUID postId);

    boolean existsByUserUserIdAndPostPostId(UUID userId, UUID postId);

    Page<SavedPost> findByUserUserIdOrderBySavedAtDesc(UUID userId, Pageable pageable);

    List<SavedPost> findByUserUserId(UUID userId);

    @Query("SELECT s.post.postId FROM SavedPost s WHERE s.user.userId = :userId AND s.post.postId IN :postIds")
    List<UUID> findSavedPostIdsByUserIdAndPostIds(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);

    void deleteByPostPostId(UUID postId);

    void deleteByUserUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM SavedPost s WHERE s.post.author.userId = :userId")
    void deleteSavesOnUserPosts(@Param("userId") UUID userId);
}
