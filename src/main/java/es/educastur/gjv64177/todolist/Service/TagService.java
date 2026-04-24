package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.model.Tag;
import es.educastur.gjv64177.todolist.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TagService {

	@Autowired
	private TagRepository tagRepository;

	public Tag findByName(String name) {
		String finalName = name.trim().toLowerCase();
		return tagRepository.findByName(finalName).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag con nombre " + name + " no encontrada"));
	}

	public Tag findById(Long id) {
		return tagRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag con id " + id + " no encontrada"));
	}

	public void deleteById(Long id) {
		Tag existingTag = findById(id);
		tagRepository.delete(existingTag);
	}
	
	public void deleteByName(String name) {
		Tag existingTag = findByName(name);
		tagRepository.delete(existingTag);
	}

	public List<Tag> listAll() {
		return tagRepository.findAll();
	}

	public Tag save(Tag tag) {
		return tagRepository.save(tag);
	}
}
