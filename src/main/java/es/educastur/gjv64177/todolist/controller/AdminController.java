package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.CategoryService;
import es.educastur.gjv64177.todolist.Service.TaskService;
import es.educastur.gjv64177.todolist.Service.UsuarioService;
import es.educastur.gjv64177.todolist.dto.TaskUserDTO;
import es.educastur.gjv64177.todolist.dto.UserTasksDTO;
import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.mapper.TaskMapper;
import es.educastur.gjv64177.todolist.mapper.UsuarioMapper;
import es.educastur.gjv64177.todolist.model.Category;
import es.educastur.gjv64177.todolist.model.Task;
import es.educastur.gjv64177.todolist.model.Usuario;
import es.educastur.gjv64177.todolist.repository.CategoryRepository;
import es.educastur.gjv64177.todolist.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	@Autowired private UsuarioService usuarioService;
	@Autowired private TaskService taskService;
	@Autowired private CategoryService categoryService;
	@Autowired private TaskRepository taskRepository;
	@Autowired private UsuarioMapper usuarioMapper;
	@Autowired private TaskMapper taskMapper;

	@GetMapping("/users")
	public ResponseEntity<List<UsuarioDTO>> listAll() {
		List<UsuarioDTO> list = usuarioService.listarTodos().stream()
				.map(usuarioMapper::toDTO).toList();
		return ResponseEntity.ok(list);
	}

	@GetMapping("/users/{username}/full-profile")
	public ResponseEntity<UserTasksDTO> getFullUserProfile(@PathVariable String username) {

		Usuario usuarioSeguro = usuarioService.findByUsername(username);
		
		List<Task> tareasDelUsuario = taskService.listByAuthor(usuarioSeguro);

		UserTasksDTO response = usuarioMapper.toUserTasksDTO(usuarioSeguro, tareasDelUsuario);

		return ResponseEntity.ok(response);
	}

	@PatchMapping("/users/{username}/promote")
	public ResponseEntity<Void> makeAdmin(@PathVariable String username) {
		usuarioService.makeAdmin(username);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/categories")
	public ResponseEntity<Category> createCat(@RequestBody Category categoryRequest) {
		Category category = new Category();
		String title = categoryRequest.getTitle().substring(0, 1).toUpperCase() + categoryRequest.getTitle().substring(1).toLowerCase();
		category.setTitle(title);
		Category savedCat = categoryService.save(category);
		return ResponseEntity.status(HttpStatus.CREATED).body(savedCat);
	}

	@DeleteMapping("/categories/{id}")
	public ResponseEntity<Void> borrarCategoria(@PathVariable Long id) {
		List<Task> tareasAfectadas = taskRepository.findByCategories_Id(id);
		for (Task t : tareasAfectadas) {
			t.setCategories(null);
			taskService.save(t);
		}
		categoryService.deleteById(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/tasks")
	public ResponseEntity<List<TaskUserDTO>> getAllTasks() {
		List<TaskUserDTO> list = taskService.listFromAny().stream()
				.map(taskMapper::toUserDTO).toList();
		return ResponseEntity.ok(list);
	}

	@DeleteMapping("/tasks/{id}")
	public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
		taskService.deleteFromAny(id);
		return ResponseEntity.noContent().build();
	}
}