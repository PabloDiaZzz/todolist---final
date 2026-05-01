package es.educastur.gjv64177.todolist.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Task {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private LocalDateTime createdAt;

	private LocalDateTime deadline;

	private LocalDateTime lastEdit;

	@Column(nullable = false)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	private boolean completed = false;

	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "author_id", nullable = false)
	private Usuario author;

	@ManyToMany
	@JoinTable(
			name = "tarea_cats",
			joinColumns = @JoinColumn(name = "tarea_id"),
			inverseJoinColumns = @JoinColumn(name = "cat_id")
	)
	private Set<Category> categories = new HashSet<>();
	@ManyToMany
	@JoinTable(
			name = "tarea_tags",
			joinColumns = @JoinColumn(name = "tarea_id"),
			inverseJoinColumns = @JoinColumn(name = "tag_id")
	)
	private Set<Tag> tags = new HashSet<>();
	
	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.lastEdit = LocalDateTime.now();
	}

	@PreUpdate
	protected void onUpdate() {
		this.lastEdit = LocalDateTime.now();
	}
}