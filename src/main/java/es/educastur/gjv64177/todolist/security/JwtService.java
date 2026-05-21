package es.educastur.gjv64177.todolist.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

	private static final String SECRET_KEY = "MiClaveSecretaSuperSeguraParaLaTodoListDeClase2026";
	private static final long EXPIRATION_TIME = 86400000;

	private Key getSigningKey() {
		return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
	}

	public String generarToken(String username) {
		return Jwts.builder()
				.setSubject(username)
				.setIssuedAt(new Date(System.currentTimeMillis()))
				.setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
				.signWith(getSigningKey(), SignatureAlgorithm.HS256)
				.compact();
	}

	public String extraerUsername(String token) {
		return extraerClaim(token, Claims::getSubject);
	}

	public boolean isTokenValido(String token, String username) {
		final String tokenUsername = extraerUsername(token);
		return (tokenUsername.equals(username) && !isTokenExpirado(token));
	}

	private boolean isTokenExpirado(String token) {
		return extraerClaim(token, Claims::getExpiration).before(new Date());
	}

	public <T> T extraerClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = Jwts.parserBuilder()
				.setSigningKey(getSigningKey())
				.build()
				.parseClaimsJws(token)
				.getBody();
		return claimsResolver.apply(claims);
	}
}