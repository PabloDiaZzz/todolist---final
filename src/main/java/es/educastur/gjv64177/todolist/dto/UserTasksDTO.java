package es.educastur.gjv64177.todolist.dto;

import java.util.List;

public record UserTasksDTO(
	UsuarioDTO user,
	List<TaskResponseDTO> tasks
) {}
