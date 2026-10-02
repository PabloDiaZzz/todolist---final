package es.educastur.gjv64177.todolist.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthFilter;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
		this.jwtAuthFilter = jwtAuthFilter;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable);
		
		http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

		http.authorizeHttpRequests(auth -> auth
				.requestMatchers("/", "/login", "/register", "/css/**", "/js/**", "/assets/**", "/favicon-login.svg", "/api/auth/**", "/error", "/forgot-password", "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/actuator/health")
				.permitAll()
				.requestMatchers("/api/admin/users/**", "/api/admin/users").hasRole("ADMIN")
				.requestMatchers("/api/admin/categories/**", "/api/admin/categories", "/api/admin/tasks/**", "/api/admin/tasks").hasAnyRole("ADMIN", "MANAGER")
				.requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
				.anyRequest().authenticated());
		
		http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

		http.exceptionHandling(exception -> exception
				.authenticationEntryPoint((request, response, authenticationException) ->
						                          response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No autenticado")
				)
		);

		return http.build();
	}
}
