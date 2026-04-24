package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.TagService;
import es.educastur.gjv64177.todolist.dto.TagDTO;
import es.educastur.gjv64177.todolist.model.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tag")
public class TagController {
	@Autowired
	private TagService tagService;

	@GetMapping
	public ResponseEntity<List<Tag>> listAll() {
		return ResponseEntity.ok(tagService.listAll());
	}

	@GetMapping("/name/{name}")
	public ResponseEntity<Tag> getByName(@PathVariable String name) {
		return ResponseEntity.ok(tagService.findByName(name));
	}

	@PostMapping
	public ResponseEntity<Tag> create(@Valid @RequestBody TagDTO tag) {
		Tag newTag = Tag.builder()
				.name(tag.name().trim().toLowerCase().replaceAll("\\s+", " "))
				.build();
		Tag finalTag = tagService.save(newTag);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(finalTag);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Tag> update(@PathVariable Long id, @Valid @RequestBody TagDTO tag) {
		Tag existingTag = tagService.findById(id);
		existingTag.setName(tag.name().trim().toLowerCase().replaceAll("\\s+", " "));
		Tag finalTag = tagService.save(existingTag);
		return ResponseEntity.ok(finalTag);
	}

	@DeleteMapping("/id/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		tagService.deleteById(id);
		return ResponseEntity.noContent()
				.build();
	}

	@DeleteMapping("/name/{name}")
	public ResponseEntity<Void> deleteByName(@PathVariable String name) {
		tagService.deleteByName(name);
		return ResponseEntity.noContent()
				.build();
	}
}