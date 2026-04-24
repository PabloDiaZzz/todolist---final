package es.educastur.gjv64177.todolist.dto;

public record TaskRequestDTO(
		String title,
		String description,
		Long categoryId,
		String tagsInput
) {}