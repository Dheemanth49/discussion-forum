package com.forum.repository;

import com.forum.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteRepository extends JpaRepository<Vote, UUID> {

    Optional<Vote> findByUserUserIdAndPostPostId(UUID userId, UUID postId);

    Optional<Vote> findByUserUserIdAndCommentCommentId(UUID userId, UUID commentId);

    @Query("SELECT COALESCE(SUM(v.voteType), 0) FROM Vote v WHERE v.post.postId = :postId AND v.voteType = 1")
    long countUpvotesByPostId(@Param("postId") UUID postId);

    @Query("SELECT COALESCE(SUM(CASE WHEN v.voteType = -1 THEN 1 ELSE 0 END), 0) FROM Vote v WHERE v.post.postId = :postId")
    long countDownvotesByPostId(@Param("postId") UUID postId);

    @Query("SELECT COALESCE(SUM(CASE WHEN v.voteType = 1 THEN 1 ELSE 0 END), 0) FROM Vote v WHERE v.comment.commentId = :commentId")
    long countUpvotesByCommentId(@Param("commentId") UUID commentId);

    @Query("SELECT v FROM Vote v WHERE v.user.userId = :userId AND v.post.postId IN :postIds")
    List<Vote> findByUserIdAndPostIds(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);

    @Query("SELECT v FROM Vote v WHERE v.user.userId = :userId AND v.comment.commentId IN :commentIds")
    List<Vote> findByUserIdAndCommentIds(@Param("userId") UUID userId, @Param("commentIds") List<UUID> commentIds);

    void deleteByPostPostId(UUID postId);

    void deleteByCommentCommentId(UUID commentId);

    void deleteByUserUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM Vote v WHERE v.post.author.userId = :userId")
    void deleteVotesOnUserPosts(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Vote v WHERE v.comment.author.userId = :userId")
    void deleteVotesOnUserComments(@Param("userId") UUID userId);
}
