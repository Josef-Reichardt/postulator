package de.jr.postulator.postulator.model;

import lombok.Data;

@Data
public class Gemeinde {
    private String landkreis;
    private String gemeinde;
    private String adresse;
    private String kontakt;
    private String email;
}
