package es.educastur.gjv64177.todolist.mapper;

import es.educastur.gjv64177.todolist.dto.TaskResponseDTO;
import es.educastur.gjv64177.todolist.dto.TaskUserDTO;
import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.model.Task;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskMapper {
	TaskResponseDTO toDTO(Task task);

	@Mapping(target = "task", source = ".")
	@Mapping(target = "author", source = "author")
	TaskUserDTO toUserDTO(Task task);
}