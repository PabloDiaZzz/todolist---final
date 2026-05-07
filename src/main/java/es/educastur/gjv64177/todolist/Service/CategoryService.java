package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.model.Category;
import es.educastur.gjv64177.todolist.repository.CategoryRepository;
import es.educastur.gjv64177.todolist.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

	@Autowired private CategoryRepository categoryRepository;
	@Autowired private TaskRepository taskRepository;

	public Category save(Category category) {
		return categoryRepository.save(category);
	}

	public void deleteById(Long id) {
		taskRepository.findByCategories_Id(id).forEach(t -> {
			t.setCategories(t.getCategories().stream().filter(c -> !c.getId().equals(id)).collect(Collectors.toSet()));
			taskRepository.save(t);
		});
		categoryRepository.deleteById(id);
	}

	public List<Category> findAll() {
		return categoryRepository.findAll();
	}

	public Category findById(Long id) {
		return categoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada con id " + id));
	}
}
