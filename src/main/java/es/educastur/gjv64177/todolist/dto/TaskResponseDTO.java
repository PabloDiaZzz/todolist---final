package es.educastur.gjv64177.todolist.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record TaskResponseDTO(
		Long id,
		String title,
		String description,
		boolean completed,
		LocalDateTime createdAt,
		CategoryDTO category,
		Set<TagDTO> tags
) {}