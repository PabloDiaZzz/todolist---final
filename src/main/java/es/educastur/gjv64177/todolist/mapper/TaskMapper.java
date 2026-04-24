package es.educastur.gjv64177.todolist.mapper;

import es.educastur.gjv64177.todolist.dto.TaskResponseDTO;
import es.educastur.gjv64177.todolist.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskMapper {
	TaskResponseDTO toDTO(Task task);
}