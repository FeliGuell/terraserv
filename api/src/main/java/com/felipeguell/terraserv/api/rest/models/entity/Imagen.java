package com.felipeguell.terraserv.api.rest.models.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Entity
@Table(name = "imagenes")
public class Imagen{
	
	@Id
	@Column(name = "id_imagen")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(name ="imagen_key")
	private String imagenKey;
	
	@Column(name ="imagen_file_name")
	private String imagenFileName;
	
	@Column(name ="imagen_size")
	private Long imagenSize;
	
	@Transient
	private String imagenUrl;
}
