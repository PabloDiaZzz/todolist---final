package es.educastur.gjv64177.todolist.mapper;

import es.educastur.gjv64177.todolist.dto.UserTasksDTO;
import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.model.Task;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {TaskMapper.class})
public interface UsuarioMapper {

	UsuarioDTO toDTO(Usuario usuario);

	@Mapping(target = "password", ignore = true)
	Usuario toEntity(UsuarioDTO usuarioDTO);

	@Mapping(target = "user", source = "usuario")
	@Mapping(target = "tasks", source = "tasks")
	UserTasksDTO toUserTasksDTO(Usuario usuario, List<Task> tasks);
}