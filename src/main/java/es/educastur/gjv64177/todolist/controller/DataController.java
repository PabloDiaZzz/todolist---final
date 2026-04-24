package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.UsuarioService;
import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.mapper.UsuarioMapper;
import es.educastur.gjv64177.todolist.model.Category;
import es.educastur.gjv64177.todolist.model.Tag;
import es.educastur.gjv64177.todolist.model.Usuario;
import es.educastur.gjv64177.todolist.repository.CategoryRepository;
import es.educastur.gjv64177.todolist.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DataController {

	@Autowired private UsuarioService usuarioService;
	@Autowired private UsuarioMapper usuarioMapper;
	@Autowired private CategoryRepository categoryRepository;
	@Autowired private TagRepository tagRepository;
	
	@GetMapping("/init")
	public ResponseEntity<Object> getInitialData(Authentication auth) {
		Usuario user = usuarioService.findByUsername(auth.getName());
		return ResponseEntity.ok(java.util.Map.of(
				"user", usuarioMapper.toDTO(user),
				"categories", categoryRepository.findAll()
		));
	}

}