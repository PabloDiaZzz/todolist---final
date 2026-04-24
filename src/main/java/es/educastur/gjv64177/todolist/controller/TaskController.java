package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.TaskService;
import es.educastur.gjv64177.todolist.Service.UsuarioService;
import es.educastur.gjv64177.todolist.dto.TaskRequestDTO;
import es.educastur.gjv64177.todolist.dto.TaskResponseDTO;
import es.educastur.gjv64177.todolist.mapper.TaskMapper;
import es.educastur.gjv64177.todolist.model.Task;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	@Autowired private TaskMapper taskMapper;
	@Autowired private TaskService taskService;
	@Autowired private UsuarioService usuarioService;

	@GetMapping
	public ResponseEntity<List<TaskResponseDTO>> getMyTasks(Authentication authentication) {
		Usuario user = usuarioService.findByUsername(authentication.getName());
		List<TaskResponseDTO> dtoList = taskService.listByAuthor(user).stream()
				.map(taskMapper::toDTO)
				.toList();
		return ResponseEntity.ok(dtoList);
	}

	@PostMapping
	public ResponseEntity<TaskResponseDTO> createTask(@RequestBody TaskRequestDTO dto, Authentication authentication) {
		Usuario user = usuarioService.findByUsername(authentication.getName());
		Task task = new Task();
		task.setTitle(dto.title());
		task.setDescription(dto.description());
		taskService.save(task, user, dto.categoryId(), dto.tagsInput());
		return ResponseEntity.status(HttpStatus.CREATED).body(taskMapper.toDTO(task));
	}

	@PutMapping("/{id}")
	public ResponseEntity<TaskResponseDTO> editTask(@PathVariable Long id, @RequestBody TaskRequestDTO dto, Authentication authentication) {
		Usuario user = usuarioService.findByUsername(authentication.getName());
		Task finalTask = taskService.editTask(id, user, dto.title(), dto.description(), dto.categoryId(), dto.tagsInput());
		return ResponseEntity.ok(taskMapper.toDTO(finalTask));
	}

	@PatchMapping("/{id}/toggle")
	public ResponseEntity<Void> toggleTask(@PathVariable Long id, Authentication authentication) {
		Usuario user = usuarioService.findByUsername(authentication.getName());
		taskService.toggleComplete(id, user);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication authentication) {
		Usuario user = usuarioService.findByUsername(authentication.getName());
		taskService.delete(id, user);
		return ResponseEntity.noContent().build();
	}
}