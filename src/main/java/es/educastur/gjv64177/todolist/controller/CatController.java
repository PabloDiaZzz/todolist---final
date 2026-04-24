package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.CategoryService;
import es.educastur.gjv64177.todolist.model.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cats")
public class CatController {
	
	@Autowired private CategoryService categoryService;

	@GetMapping
	public ResponseEntity<List<Category>> listAll() {
		List<Category> list = categoryService.findAll();
		return ResponseEntity.ok(list);
	}

	@GetMapping("/{id}")
	public ResponseEntity<Category> getById(Long id) {
		return ResponseEntity.ok(categoryService.findById(id));
	}
}
