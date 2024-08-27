package com.felipeguell.terraserv.api.rest.models.entity;


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
@Table(name = "archivos_adjuntos")
public class ArchivoAdjunto{

	@Id
	@Column(name = "id_archivo")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name="archivo_key")
	private String archivoKey;
	
	@Column(name="archivo_file_name")
	private String archivoFileName;
	
	@Column(name="archivo_size")
	private Long archivoSize;
	
	@Transient
	private String archivoUrl;

}
