package com.forum.service;

import com.forum.dto.PostRequest;
import com.forum.dto.PostResponse;
import com.forum.dto.SummaryResponse;
import com.forum.model.*;
import com.forum.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final SavedPostRepository savedPostRepository;
    private final AiService aiService;
    private final EmbeddingService embeddingService;


    public Page<PostResponse> getAllPosts(int page, int size, String sort, User currentUser) {
        Pageable pageable = createPageable(page, size, sort);
        return mapPageToResponse(postRepository.findAll(pageable), currentUser);
    }

    public Page<PostResponse> getPostsByCategory(Long categoryId, int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mapPageToResponse(postRepository.findByCategoryCategoryId(categoryId, pageable), currentUser);
    }

    public Page<PostResponse> getPostsByUser(UUID userId, int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mapPageToResponse(postRepository.findByAuthorUserId(userId, pageable), currentUser);
    }

    public Page<PostResponse> searchPosts(String query, int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size);
        
        String embeddingStr = embeddingService.generateQueryEmbedding(query);
        
        // 1. Get Text Search Results
        Pageable textPageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> textResultsPage = postRepository.searchPostsText(query, textPageable);
        List<Post> textResults = textResultsPage.getContent();

        if (embeddingStr != null) {
            // 2. Get Semantic Search Results
            Page<Object[]> semanticResults = postRepository.searchPostsSemantic(embeddingStr, pageable);
            
            if (semanticResults.isEmpty()) {
                return mapPageToResponse(textResultsPage, currentUser);
            }
            
            Map<UUID, Double> semanticScores = new HashMap<>();
            List<UUID> semanticPostIds = new ArrayList<>();
            
            for (Object[] obj : semanticResults.getContent()) {
                UUID id = obj[0] instanceof String ? UUID.fromString((String) obj[0]) : (UUID) obj[0];
                semanticPostIds.add(id);
                semanticScores.put(id, ((Number) obj[1]).doubleValue());
            }
            
            // 3. Combine and De-duplicate
            Set<UUID> allPostIds = new LinkedHashSet<>(); // Maintains order
            
            // Add semantic results first (usually more relevant)
            // But only if score is decent (e.g. > 0.6)
            for (UUID id : semanticPostIds) {
                if (semanticScores.get(id) > 0.6) {
                    allPostIds.add(id);
                }
            }
            
            // Add text results
            for (Post p : textResults) {
                allPostIds.add(p.getPostId());
            }

            // If still too few results, add lower score semantic results
            if (allPostIds.size() < size) {
                for (UUID id : semanticPostIds) {
                    allPostIds.add(id);
                }
            }
            
            List<UUID> finalIds = new ArrayList<>(allPostIds);
            // Limit to requested size
            if (finalIds.size() > size) {
                finalIds = finalIds.subList(0, size);
            }
            
            List<Post> posts = postRepository.findAllById(finalIds);
            Map<UUID, Post> postMap = posts.stream().collect(Collectors.toMap(Post::getPostId, p -> p));
            List<Post> orderedPosts = finalIds.stream().map(postMap::get).filter(Objects::nonNull).collect(Collectors.toList());
            
            Page<Post> postPage = new org.springframework.data.domain.PageImpl<>(orderedPosts, pageable, Math.max(textResultsPage.getTotalElements(), semanticResults.getTotalElements()));
            
            Page<PostResponse> responsePage = mapPageToResponse(postPage, currentUser);
            
            responsePage.getContent().forEach(resp -> {
                Double score = semanticScores.get(resp.getPostId());
                if (score != null) {
                    resp.setRelevanceScore(score);
                }
            });
            
            return responsePage;
        } else {
            return mapPageToResponse(textResultsPage, currentUser);
        }
    }

    public Page<PostResponse> getTrendingPosts(int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size);
        java.time.LocalDateTime sevenDaysAgo = java.time.LocalDateTime.now().minusDays(7);
        return mapPageToResponse(postRepository.findTrending(sevenDaysAgo, pageable), currentUser);
    }

    public Page<PostResponse> getUnansweredPosts(int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size);
        return mapPageToResponse(postRepository.findUnanswered(pageable), currentUser);
    }

    @Transactional
    public PostResponse getPostById(UUID postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        return mapToResponse(post, currentUser);
    }

    public SummaryResponse getPostSummary(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        List<Comment> comments = commentRepository.findByPostPostIdOrderByCreatedAtAsc(postId);

        // Cap to latest 50 comments
        if (comments.size() > 50) {
            comments = comments.subList(comments.size() - 50, comments.size());
        }

        StringBuilder discussionBuilder = new StringBuilder();

        // ✅ CLEAN STRUCTURED INPUT (VERY IMPORTANT)
        discussionBuilder.append("Title: ").append(post.getTitle()).append("\n\n");
        discussionBuilder.append("Post: ").append(post.getContent()).append("\n\n");

        if (comments.isEmpty()) {
            discussionBuilder.append("No comments yet.");
        } else {
            discussionBuilder.append("Comments:\n");
            for (Comment comment : comments) {
                discussionBuilder.append("- ")
                        .append(comment.getAuthor().getUsername())
                        .append(": ")
                        .append(comment.getContent())
                        .append("\n");
            }
        }

        // 🚀 THIS is what goes to AI
        String fullDiscussion = discussionBuilder.toString();

        return new SummaryResponse(aiService.generateSummary(fullDiscussion));
    }

    public PostResponse createPost(PostRequest request, User author) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(author)
                .category(category)
                .mediaUrl(request.getMediaUrl())
                .build();

        post = postRepository.save(post);

        // Trigger embedding generation via Python service
        embeddingService.processPost(post.getPostId());

        return mapToResponse(post, author);
    }

    public PostResponse updatePost(UUID postId, PostRequest request, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("You can only edit your own posts");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCategory(category);
        if (request.getMediaUrl() != null) post.setMediaUrl(request.getMediaUrl());

        post = postRepository.save(post);
        return mapToResponse(post, currentUser);
    }

    public void deletePost(UUID postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getUserId().equals(currentUser.getUserId())
                && !currentUser.getRole().name().equals("ADMIN")) {
            throw new RuntimeException("You don't have permission to delete this post");
        }

        postRepository.delete(post);
    }

    @Transactional
    public PostResponse votePost(UUID postId, boolean isUpvote, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        int newVoteType = isUpvote ? 1 : -1;

        Optional<Vote> existingVote = voteRepository.findByUserUserIdAndPostPostId(
                currentUser.getUserId(), postId);

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getVoteType() == newVoteType) {
                // Same vote again = remove vote (toggle off)
                if (newVoteType == 1) {
                    post.setUpvotes(post.getUpvotes() - 1);
                } else {
                    post.setDownvotes(post.getDownvotes() - 1);
                }
                voteRepository.delete(vote);
            } else {
                // Switching vote direction
                if (newVoteType == 1) {
                    post.setUpvotes(post.getUpvotes() + 1);
                    post.setDownvotes(post.getDownvotes() - 1);
                } else {
                    post.setUpvotes(post.getUpvotes() - 1);
                    post.setDownvotes(post.getDownvotes() + 1);
                }
                vote.setVoteType(newVoteType);
                voteRepository.save(vote);
            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .user(currentUser)
                    .post(post)
                    .voteType(newVoteType)
                    .build();
            voteRepository.save(vote);

            if (isUpvote) {
                post.setUpvotes(post.getUpvotes() + 1);
            } else {
                post.setDownvotes(post.getDownvotes() + 1);
            }
        }

        post = postRepository.save(post);
        return mapToResponse(post, currentUser);
    }

    @Transactional
    public PostResponse toggleSavePost(UUID postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Optional<SavedPost> existing = savedPostRepository.findByUserUserIdAndPostPostId(
                currentUser.getUserId(), postId);

        if (existing.isPresent()) {
            savedPostRepository.delete(existing.get());
        } else {
            SavedPost saved = SavedPost.builder()
                    .user(currentUser)
                    .post(post)
                    .build();
            savedPostRepository.save(saved);
        }

        return mapToResponse(post, currentUser);
    }

    public Page<PostResponse> getSavedPosts(User currentUser, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = savedPostRepository.findByUserUserIdOrderBySavedAtDesc(currentUser.getUserId(), pageable)
                .map(SavedPost::getPost);
        return mapPageToResponse(posts, currentUser);
    }

    private Page<PostResponse> mapPageToResponse(Page<Post> posts, User currentUser) {
        if (!posts.hasContent()) {
            return posts.map(post -> mapToResponse(post, currentUser));
        }

        List<UUID> postIds = posts.stream().map(Post::getPostId).collect(Collectors.toList());

        Map<UUID, Integer> commentCounts = new HashMap<>();
        for (Object[] result : commentRepository.countCommentsByPostIds(postIds)) {
            commentCounts.put((UUID) result[0], ((Number) result[1]).intValue());
        }

        Map<UUID, Integer> userVotes = new HashMap<>();
        Set<UUID> savedPostIds = new HashSet<>();

        if (currentUser != null) {
            List<Vote> votes = voteRepository.findByUserIdAndPostIds(currentUser.getUserId(), postIds);
            for (Vote vote : votes) {
                userVotes.put(vote.getPost().getPostId(), vote.getVoteType());
            }
            savedPostIds.addAll(savedPostRepository.findSavedPostIdsByUserIdAndPostIds(currentUser.getUserId(), postIds));
        }

        return posts.map(post -> {
            int commentCount = commentCounts.getOrDefault(post.getPostId(), 0);
            Integer userVote = userVotes.get(post.getPostId());
            boolean isSaved = savedPostIds.contains(post.getPostId());
            return buildPostResponse(post, commentCount, userVote, isSaved);
        });
    }

    private PostResponse mapToResponse(Post post, User currentUser) {
        int commentCount = (int) commentRepository.countByPostPostId(post.getPostId());
        Integer userVote = null;
        boolean isSaved = false;

        if (currentUser != null) {
            Optional<Vote> userVoteOpt = voteRepository.findByUserUserIdAndPostPostId(
                    currentUser.getUserId(), post.getPostId());
            userVote = userVoteOpt.map(Vote::getVoteType).orElse(null);
            isSaved = savedPostRepository.existsByUserUserIdAndPostPostId(
                    currentUser.getUserId(), post.getPostId());
        }

        return buildPostResponse(post, commentCount, userVote, isSaved);
    }

    private PostResponse buildPostResponse(Post post, int commentCount, Integer userVote, boolean isSaved) {
        return PostResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorUsername(post.getAuthor().getUsername())
                .authorId(post.getAuthor().getUserId())
                .authorImageUrl(post.getAuthor().getProfileImageUrl())
                .categoryName(post.getCategory().getName())
                .categoryId(post.getCategory().getCategoryId())
                .upvotes(post.getUpvotes())
                .downvotes(post.getDownvotes())
                .viewCount(post.getViewCount())
                .commentCount(commentCount)
                .mediaUrl(post.getMediaUrl())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .userVote(userVote)
                .isSaved(isSaved)
                .build();
    }

    public long triggerReembedAllPosts() {
        List<Post> allPosts = postRepository.findAll();
        allPosts.forEach(post -> embeddingService.processPost(post.getPostId()));
        return allPosts.size();
    }

    private Pageable createPageable(int page, int size, String sort) {
        return switch (sort) {
            case "trending" -> PageRequest.of(page, size, Sort.by("upvotes").descending());
            case "oldest" -> PageRequest.of(page, size, Sort.by("createdAt").ascending());
            default -> PageRequest.of(page, size, Sort.by("createdAt").descending());
        };
    }
}
