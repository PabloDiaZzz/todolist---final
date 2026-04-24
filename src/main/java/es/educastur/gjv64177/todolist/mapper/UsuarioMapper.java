package es.educastur.gjv64177.todolist.mapper;

import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UsuarioMapper {

	UsuarioDTO toDTO(Usuario usuario);

	@Mapping(target = "password", ignore = true)
	Usuario toEntity(UsuarioDTO usuarioDTO);
}