package de.jr.postulator.postulator.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@XmlRootElement(name = "location")
@XmlAccessorType(XmlAccessType.FIELD)
public class Location {
    private String name;
    private String title;
    @Builder.Default
    private String value = "0";
    private String locationId;
    private String color;
    private String zIndex;
    @XmlElement(name = "coordinate")
    private List<String> coordinates;

    private boolean notFound;
    private boolean duplicate;
}
