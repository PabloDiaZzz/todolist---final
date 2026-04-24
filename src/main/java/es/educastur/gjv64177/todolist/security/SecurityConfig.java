package es.educastur.gjv64177.todolist.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable);
		http.authorizeHttpRequests(auth -> auth.requestMatchers("/", "/login", "/register", "/css/**", "/js/**", "/assets/**", "/favicon-login.svg", "/api/auth/*","/error", "/forgot-password", "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
				.permitAll()
				.requestMatchers("/admin/**", "/api/admin/**")
				.hasRole("ADMIN")
				.anyRequest()
				.authenticated());

		http.formLogin(form -> form.loginProcessingUrl("/api/login")
				.successHandler((request, response, authentication) -> {
					response.setStatus(HttpServletResponse.SC_OK);
				})
				.failureHandler((request, response, authenticationException) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Credenciales incorrectas"))
				.permitAll());

		http.exceptionHandling(exception -> exception
				.authenticationEntryPoint((request, response, authenticationException) ->
						                          response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No autenticado")
				)
		);

		http.logout(logout -> logout
				.logoutUrl("/api/logout")
				.logoutSuccessHandler((request, response, authentication) -> response.setStatus(HttpServletResponse.SC_OK))
				.invalidateHttpSession(true)
				.deleteCookies("JSESSIONID")
				.permitAll()
		);

		return http.build();
	}
}