package com.forum.service;

import com.forum.model.Category;
import com.forum.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(String name, String description, String iconName) {
        if (categoryRepository.existsByName(name)) {
            throw new RuntimeException("Category already exists");
        }
        Category category = Category.builder()
                .name(name)
                .description(description)
                .iconName(iconName)
                .build();
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
