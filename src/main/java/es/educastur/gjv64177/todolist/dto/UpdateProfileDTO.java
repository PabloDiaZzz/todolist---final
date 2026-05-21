package es.educastur.gjv64177.todolist.dto;

public record UpdateProfileDTO(
        String username,
        String fullName,
        String email,
        String theme
) {}
