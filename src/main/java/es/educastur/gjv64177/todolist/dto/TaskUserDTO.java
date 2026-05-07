package es.educastur.gjv64177.todolist.dto;

public record TaskUserDTO(
		TaskResponseDTO task,
		UsuarioDTO author
) {}
