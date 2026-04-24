package es.educastur.gjv64177.todolist.repository;
import es.educastur.gjv64177.todolist.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
	
	Optional<Tag> findByName(String name);
}