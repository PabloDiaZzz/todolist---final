package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.model.Tag;
import es.educastur.gjv64177.todolist.model.Task;
import es.educastur.gjv64177.todolist.model.Usuario;
import es.educastur.gjv64177.todolist.repository.CategoryRepository;
import es.educastur.gjv64177.todolist.repository.TagRepository;
import es.educastur.gjv64177.todolist.repository.TaskRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskService {
	@Autowired private TaskRepository taskRepository;
	@Autowired private CategoryRepository categoryRepository;
	@Autowired private TagRepository tagRepository;

	public List<Task> listByAuthor(Usuario autor) {
		return taskRepository.findByAuthor(autor);
	}

	private Set<Tag> procesarTags(String tagsInput) {
		Set<Tag> tags = new HashSet<>();
		if (tagsInput != null && !tagsInput.trim().isEmpty()) {
			String[] nombresTags = tagsInput.split(",");

			for (String nombre : nombresTags) {
				String nombreLimpio = nombre.trim().toLowerCase();

				if (!nombreLimpio.isEmpty()) {
					Tag tag = tagRepository.findByName(nombreLimpio)
							.orElseGet(() -> tagRepository.save(new Tag(null, nombreLimpio)));
					tags.add(tag);
				}
			}
		}
		return tags;
	}

	public void save(Task task, Usuario autor, Long categoryId, String tagsInput) {
		task.setAuthor(autor);
		if (categoryId != null) {
			task.setCategory(categoryRepository.findById(categoryId).orElse(null));
		}
		task.setTags(procesarTags(tagsInput));
		taskRepository.save(task);
	}

	public Task editTask(Long id, Usuario autor, String title, String description, Long categoryId, String tagsInput) {
		Task task = findByIdAndAuthor(id, autor);
		task.setTitle(title);
		task.setDescription(description);

		if (categoryId != null) {
			task.setCategory(categoryRepository.findById(categoryId).orElse(null));
		} else {
			task.setCategory(null);
		}

		task.setTags(procesarTags(tagsInput));
		return taskRepository.save(task);
	}

	public Task findByIdAndAuthor(Long id, Usuario author) {
		return taskRepository.findById(id)
				.filter(task -> task.getAuthor().getId().equals(author.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada o sin permiso"));
	}

	@Transactional
	public void delete(Long id, Usuario author) {
		Task task = findByIdAndAuthor(id, author);
		Set<Tag> tags = new HashSet<>(task.getTags());
		taskRepository.delete(task);
		for (Tag tag : tags) {
			if (!taskRepository.existsByTags(tag)) {
				tagRepository.delete(tag);
			}
		}   
	}

	public void toggleComplete(Long id, Usuario author) {
		Task task = findByIdAndAuthor(id, author);
		task.setCompleted(!task.isCompleted());
		taskRepository.save(task);
	}

	public List<Task> listFromAny() {
		return taskRepository.findAll();
	}

	public void deleteFromAny(Long id) {
		taskRepository.deleteById(id);
	}
}
