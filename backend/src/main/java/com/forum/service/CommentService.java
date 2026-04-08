package com.forum.service;

import com.forum.dto.CommentRequest;
import com.forum.dto.CommentResponse;
import com.forum.model.Comment;
import com.forum.model.Post;
import com.forum.model.User;
import com.forum.model.Vote;
import com.forum.repository.CommentRepository;
import com.forum.repository.PostRepository;
import com.forum.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final VoteRepository voteRepository;

    public List<CommentResponse> getCommentsByPostId(UUID postId, User currentUser) {
        List<Comment> allComments = commentRepository.findByPostPostIdOrderByCreatedAtAsc(postId);
        
        List<UUID> commentIds = allComments.stream().map(Comment::getCommentId).collect(Collectors.toList());
        java.util.Map<UUID, Integer> userVotes = new java.util.HashMap<>();
        if (currentUser != null && !commentIds.isEmpty()) {
            List<Vote> votes = voteRepository.findByUserIdAndCommentIds(currentUser.getUserId(), commentIds);
            for (Vote v : votes) {
                userVotes.put(v.getComment().getCommentId(), v.getVoteType());
            }
        }
        
        java.util.Map<UUID, CommentResponse> responseMap = new java.util.HashMap<>();
        List<CommentResponse> rootComments = new java.util.ArrayList<>();
        
        for (Comment comment : allComments) {
            CommentResponse response = CommentResponse.builder()
                    .commentId(comment.getCommentId())
                    .content(comment.getContent())
                    .authorUsername(comment.getAuthor().getUsername())
                    .authorId(comment.getAuthor().getUserId())
                    .authorImageUrl(comment.getAuthor().getProfileImageUrl())
                    .upvotes(comment.getUpvotes())
                    .createdAt(comment.getCreatedAt())
                    .userVote(userVotes.get(comment.getCommentId()))
                    .replies(new java.util.ArrayList<>())
                    .build();
            responseMap.put(comment.getCommentId(), response);
            
            if (comment.getParentComment() == null) {
                rootComments.add(response);
            } else {
                CommentResponse parentResponse = responseMap.get(comment.getParentComment().getCommentId());
                if (parentResponse != null) {
                    parentResponse.getReplies().add(response);
                } else {
                    rootComments.add(response);
                }
            }
        }
        
        java.util.Collections.reverse(rootComments);
        return rootComments;
    }

    public CommentResponse addComment(UUID postId, CommentRequest request, User author) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .author(author)
                .post(post)
                .build();

        if (request.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            if (!parent.getPost().getPostId().equals(postId)) {
                throw new RuntimeException("Parent comment does not belong to this post");
            }
            comment.setParentComment(parent);
        }

        comment = commentRepository.save(comment);
        return mapToResponse(comment, author);
    }

    public void deleteComment(UUID postId, UUID commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        validateCommentBelongsToPost(postId, comment);

        if (!comment.getAuthor().getUserId().equals(currentUser.getUserId())
                && !currentUser.getRole().name().equals("ADMIN")) {
            throw new RuntimeException("You don't have permission to delete this comment");
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public CommentResponse voteComment(UUID postId, UUID commentId, boolean isUpvote, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        validateCommentBelongsToPost(postId, comment);

        int newVoteType = isUpvote ? 1 : -1;

        Optional<Vote> existingVote = voteRepository.findByUserUserIdAndCommentCommentId(
                currentUser.getUserId(), commentId);

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getVoteType() == newVoteType) {
                // Toggle off
                if (newVoteType == 1) {
                    comment.setUpvotes(Math.max(0, comment.getUpvotes() - 1));
                }
                voteRepository.delete(vote);
            } else {
                // Switch direction
                if (newVoteType == 1) {
                    comment.setUpvotes(comment.getUpvotes() + 1);
                } else {
                    comment.setUpvotes(Math.max(0, comment.getUpvotes() - 1));
                }
                vote.setVoteType(newVoteType);
                voteRepository.save(vote);
            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .user(currentUser)
                    .comment(comment)
                    .voteType(newVoteType)
                    .build();
            voteRepository.save(vote);

            if (isUpvote) {
                comment.setUpvotes(comment.getUpvotes() + 1);
            }
        }

        comment = commentRepository.save(comment);
        return mapToResponse(comment, currentUser);
    }

    private CommentResponse mapToResponse(Comment comment, User currentUser) {
        CommentResponse.CommentResponseBuilder builder = CommentResponse.builder()
                .commentId(comment.getCommentId())
                .content(comment.getContent())
                .authorUsername(comment.getAuthor().getUsername())
                .authorId(comment.getAuthor().getUserId())
                .authorImageUrl(comment.getAuthor().getProfileImageUrl())
                .upvotes(comment.getUpvotes())
                .createdAt(comment.getCreatedAt())
                .replies(comment.getReplies().stream()
                        .map(r -> mapToResponse(r, currentUser))
                        .collect(Collectors.toList()));

        if (currentUser != null) {
            Optional<Vote> userVote = voteRepository.findByUserUserIdAndCommentCommentId(
                    currentUser.getUserId(), comment.getCommentId());
            builder.userVote(userVote.map(Vote::getVoteType).orElse(null));
        }

        return builder.build();
    }

    private void validateCommentBelongsToPost(UUID postId, Comment comment) {
        if (!comment.getPost().getPostId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }
    }
}
