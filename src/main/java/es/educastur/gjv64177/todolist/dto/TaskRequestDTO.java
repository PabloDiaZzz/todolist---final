package es.educastur.gjv64177.todolist.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record TaskRequestDTO(
		String title,
		String description,
		LocalDateTime deadline,
		Set<Long> categoryIds,
		String tagsInput
) {}