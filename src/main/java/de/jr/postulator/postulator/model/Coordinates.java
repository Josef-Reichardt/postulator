package de.jr.postulator.postulator.model;

import lombok.Data;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

@Data
@XmlRootElement(name = "doc")
@XmlAccessorType(XmlAccessType.FIELD)
public class Coordinates {

    @XmlElement(name = "location")
    List<Location> locations;

}
