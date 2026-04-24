package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.UsuarioService;
import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.mapper.UsuarioMapper;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UsuarioController {

	@Autowired private UsuarioService usuarioService;
	@Autowired private UsuarioMapper usuarioMapper;

	@GetMapping("/me")
	public ResponseEntity<UsuarioDTO> getCurrentUser(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		Usuario user = usuarioService.findByUsername(authentication.getName());
		return ResponseEntity.ok(usuarioMapper.toDTO(user));
	}
}
