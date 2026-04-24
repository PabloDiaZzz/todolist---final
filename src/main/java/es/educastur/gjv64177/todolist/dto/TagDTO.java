package es.educastur.gjv64177.todolist.dto;

import jakarta.validation.constraints.NotBlank;

public record TagDTO(
		@NotBlank(message = "El nombre del tag no puede estar vacío")
		String name
) {}
