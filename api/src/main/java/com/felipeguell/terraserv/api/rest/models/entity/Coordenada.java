package com.felipeguell.terraserv.api.rest.models.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Entity
@Table(name = "coordenadas")
public class Coordenada{

	@Id
	@Column(name = "id_coordenada")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull(message = "La latitud decimal no puede ser nula")
	@Min(value = -90, message = "La latitud debe estar entre -90 y 90 grados.")
	@Max(value = 90, message = "La latitud debe estar entre -90 y 90 grados.")
	@Column(name = "latitud_decimal")
	private Double latitudDecimal;

	@NotNull(message = "La longitud decimal no puede ser nula")
	@Min(value = -180, message = "La longitud debe estar entre -180 y 180 grados.")
	@Max(value = 180, message = "La longitud debe estar entre -180 y 180 grados.")
	@Column(name = "longitud_decimal")
	private Double longitudDecimal;

}
