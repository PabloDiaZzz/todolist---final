package es.educastur.gjv64177.todolist.repository;
import es.educastur.gjv64177.todolist.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CategoryRepository extends JpaRepository<Category, Long> {
	
}