package es.educastur.gjv64177.todolist.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record TaskResponseDTO(
		Long id,
		String title,
		String description,
		boolean completed,
		LocalDateTime createdAt,
		LocalDateTime deadline,
		Set<CategoryDTO> categories,
		Set<TagDTO> tags
) {}