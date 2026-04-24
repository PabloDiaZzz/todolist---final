package es.educastur.gjv64177.todolist.dto;

import jakarta.validation.constraints.*;

public record UsuarioRegistroDTO(
		@NotBlank(message = "El usuario es obligatorio")
		@Size(min = 3, max = 50)
		String username,

		@NotBlank(message = "Se necesita un nombre")
		String fullName,

		@NotBlank(message = "El email es obligatorio")
		@Email(message = "El formato del email no es válido")
		String email,

		@NotBlank(message = "La contraseña es obligatoria")
		@Pattern(
				regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.])(?=\\S+$).{8,}$",
				message = "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo"
		)
		String password,

		String confirmPassword
) {}
