package es.educastur.gjv64177.todolist.repository;

import es.educastur.gjv64177.todolist.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
	
	Optional<Usuario> findByUsername(String username);
	
	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

	Optional<Usuario> findByEmail(String email);
}
