package es.educastur.gjv64177.todolist.repository;

import es.educastur.gjv64177.todolist.model.Tag;
import es.educastur.gjv64177.todolist.model.Task;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByAuthor(Usuario author);

	List<Task> findByCategoryId(Long categoryId);

	boolean existsByTags(Tag tag);
}
