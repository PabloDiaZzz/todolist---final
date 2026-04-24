package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.model.Category;
import es.educastur.gjv64177.todolist.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

	@Autowired private CategoryRepository categoryRepository;

	public Category save(Category category) {
		return categoryRepository.save(category);
	}

	public void deleteById(Long id) {
		categoryRepository.deleteById(id);
	}

	public List<Category> findAll() {
		return categoryRepository.findAll();
	}

	public Category findById(Long id) {
		return categoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada con id " + id));
	}
}
