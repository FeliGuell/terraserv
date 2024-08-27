package com.felipeguell.terraserv.api.rest.models.entity;

import java.io.Serializable;
import java.util.Date;
import java.util.List;
import java.util.Set;

import com.felipeguell.terraserv.api.rest.util.ArchivosAdjuntosUtils;
import com.felipeguell.terraserv.api.rest.util.CoordenadaUtils;
import com.felipeguell.terraserv.api.rest.util.ImagenesUtils;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({"id","nombreEstudio","fechaRealizado","nombreCliente","descripcion","ubicacionEstudio","coordenadas","tipoEstudio","areaEstudio","imagenes","archivosAdjuntos","creadoPor","fechaHoraCreacion","ultimaActualizacionPor","fechaModificacion"})
@Data
@EqualsAndHashCode(callSuper = false)
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Entity
@Table(name = "estudios_geofisicos")
public class EstudioGeofisico extends Auditable implements Serializable  {

	@Id
	@Column(name = "id_estudio")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotEmpty(message = "El nombre de estudio no puede estar vacío")
	@Column(name = "nombre_estudio")
	private String nombreEstudio;

	@NotEmpty(message = "El nombre del cliente no puede estar vacío")
	@Column(name = "nombre_cliente")
	private String nombreCliente;
	
	@NotEmpty(message = "La descripción no puede estar vacía")
	@Lob
	@Column(length = 10000)
	private String descripcion;
	
	@NotNull(message = "La fecha no puede ser nula")
	@Temporal(TemporalType.DATE)
	@DateTimeFormat(pattern = "yyyy-MM-dd")
	@JsonFormat(pattern = "yyyy-MM-dd")
	@Column(name = "fecha_realizado")
	private Date fechaRealizado;

	@NotEmpty(message = "La ubicación no puede estar vacía")
	@Column(name = "ubicacion_estudio")
	private String ubicacionEstudio;

	@Size(min = CoordenadaUtils.MIN_COORDENADAS, max = CoordenadaUtils.MAX_COORDENADAS)
	@Valid
	@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "estudio_id")
	private List<Coordenada> coordenadas;

	@NotEmpty(message = "El tipo de estudio no puede estar vacío")
	@Column(name = "tipos_estudio")
	@Enumerated(EnumType.STRING)
	@ElementCollection(targetClass = EnumTipoEstudioGeofisico.class)
	private Set<EnumTipoEstudioGeofisico> tiposEstudio;

	@NotNull(message = "El área de aplicación del estudio no puede ser nulo")
	@Column(name = "areas_estudio")
	@Enumerated(EnumType.STRING)
	@ElementCollection(targetClass = EnumAreaAplicacionEstudioGeofisico.class)
	private Set<EnumAreaAplicacionEstudioGeofisico> areasEstudio;
	
	@Size(max = ImagenesUtils.MAX_IMAGENES)
	@Valid
	@OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "estudio_id")
	private List<Imagen> imagenes;

	@Size(max = ArchivosAdjuntosUtils.MAX_ARCHIVOS_ADJUNTOS)
	@Valid
	@OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true )
	@JoinColumn(name = "estudio_id")
	private List<ArchivoAdjunto> archivosAdjuntos;

	private static final long serialVersionUID = -4662316815439866046L;

	/**
	 * Método para agregar una lista de coordenadas
	 * Valida de que no estén fuera de rango
	 * @param coordenadasNew
	 */
	public void addCoordenadas(List<Coordenada> coordenadasNew) {
		if (this.coordenadas.size() + coordenadasNew.size() > CoordenadaUtils.MAX_COORDENADAS) {
			throw new IllegalArgumentException("El número total de coordenadas no puede exceder " + CoordenadaUtils.MAX_COORDENADAS);
		}

		if(coordenadasNew.size() < 1){
			throw new IllegalArgumentException("El número total de coordenadas no puede ser menor a " + CoordenadaUtils.MIN_COORDENADAS);
		}

		for (Coordenada coordenada : coordenadasNew) {
			if (coordenada.getLatitudDecimal() < CoordenadaUtils.MIN_LATITUD
					|| coordenada.getLatitudDecimal() > CoordenadaUtils.MAX_LATITUD
					|| coordenada.getLongitudDecimal() < CoordenadaUtils.MIN_LONGITUD
					|| coordenada.getLongitudDecimal() > CoordenadaUtils.MAX_LONGITUD) {
				throw new IllegalArgumentException("Coordenada fuera de rango: " + coordenada);
			}
		}

		this.coordenadas.addAll(coordenadasNew);
	}

	/**
	 * Método para limpiar la lista de coordenadas
	 */
	public void clearCoordenadas(){
		this.coordenadas.clear();
	}


	/**
	 * Método para limpiar el conjunto de tipos de estudio
	 */
	public void clearTiposEstudio(){
		this.tiposEstudio.clear();
	}


	/**
	 * Método para agregar un conjunto de estudios geofísicos
	 */
	public void addTiposEstudio(Set<EnumTipoEstudioGeofisico> tiposEstudios){
		this.tiposEstudio.addAll(tiposEstudios);
	}

	/**
	 * Método para limpiar el conjunto de areas de aplicación de estudio
	 */
	public void clearAreasEstudio(){
		this.areasEstudio.clear();
	}


	/**
	 * Método para agregar un conjunto de áreas de aplicación de estudios geofísicos
	 */
	public void addAreasEstudio(Set<EnumAreaAplicacionEstudioGeofisico> areasEstudios){
		this.areasEstudio.addAll(areasEstudios);
	}

	/**
	 * Método para agregar un listado de imágenes
	 * @param imagenesNew
	 */
	public void addImagenes(List<Imagen> imagenesNew) {
		if (imagenes.size() + imagenesNew.size() > ImagenesUtils.MAX_IMAGENES) {
			throw new IllegalStateException("No se pueden agregar más de " + ImagenesUtils.MAX_IMAGENES + " imágenes.");
		}
		this.imagenes.addAll(imagenesNew);
	}

	/**
	 * Método para limpiar el listado de Imágenes
	 */
	public void clearImagenes(){
		this.imagenes.clear();
	}

	/**
	 * Método para agregar un listado de archivos adjuntos
	 * @param archivosAdjuntosNew
	 */
	public void addArchivosAdjuntos(List<ArchivoAdjunto> archivosAdjuntosNew) {
		if (archivosAdjuntos.size() + archivosAdjuntosNew.size() > ArchivosAdjuntosUtils.MAX_ARCHIVOS_ADJUNTOS) {
			throw new IllegalStateException("No se pueden agregar más de " + ArchivosAdjuntosUtils.MAX_ARCHIVOS_ADJUNTOS + " archivos adjuntos.");
		}
		this.archivosAdjuntos.addAll(archivosAdjuntosNew);
	}

	/**
	 * Método para limpiar el listado de archivos adjuntos
	 */
	public void clearArchivosAdjuntos(){
		this.archivosAdjuntos.clear();
	}
}
