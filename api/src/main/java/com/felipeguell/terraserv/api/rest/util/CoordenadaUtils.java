package com.felipeguell.terraserv.api.rest.util;

public class CoordenadaUtils {
    // Define los límites del rango permitido para las coordenadas decimales
    public static final double MIN_LATITUD = -90.0;
    public static final double MAX_LATITUD = 90.0;
    public static final double MIN_LONGITUD = -180.0;
    public static final double MAX_LONGITUD = 180.0;

    // Define la cantidad de coordenadas por estudio
    public static final int MAX_COORDENADAS = 6;
    public static final int MIN_COORDENADAS = 1;
}
