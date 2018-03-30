package de.jr.postulator.postulator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.jr.postulator.postulator.model.Coordinates;
import de.jr.postulator.postulator.model.Gemeinde;
import de.jr.postulator.postulator.model.Location;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ManuelleDatenService {

    private List<GemeindeAndLocation> data;

    @Getter
    private AtomicInteger posterSum;

    @Getter
    private AtomicInteger posterLocationsCount;

    public List<GemeindeAndLocation> getData() {
        if (data == null) {
            load();
        }
        return data;
    }

    @PostConstruct
    public void load() {

        List<Gemeinde> gemeinden = getGemeinden();
        Coordinates coordinates = getCoordinates();
        AtomicInteger withoutCoordinates = new AtomicInteger(0);
        List<Location> matchedCoordnateLocations = new ArrayList<>();
        posterSum = new AtomicInteger(0);
        posterLocationsCount = new AtomicInteger(0);

        data = gemeinden.stream()
                .peek(g -> g.setKontakt(g.getKontakt().replaceFirst("\\s+E-Mail:?\\s*(?:.+@.+)?$", "")))
                .map(g -> new GemeindeAndLocation(
                        g,
                        coordinates.getLocations().stream()
                                .filter(l -> {
                                    if (g.getAdresse().contains("Schaufling")) {
                                        g.setGemeinde("Schaufling");
                                    } else if (g.getAdresse().contains("Fürsteneck")) {
                                        g.setGemeinde("Fürsteneck");
                                    } else if (g.getGemeinde().contains("Tiefenbach") && g.getLandkreis().contains("Landshut")) {
                                        g.setGemeinde("Tiefenbach (88853)");
                                    } else if (g.getGemeinde().equals("Verwaltungsgemeinschaft Schönberg")) {
                                        g.setEmail("poststelle@vg-schoenberg.de");
                                    } else if (g.getGemeinde().equals("Gemeinde Langquaid")) {
                                        g.setEmail("rathaus@langquaid.de");
                                    } else if (g.getGemeinde().equals("Stadt Eggenfelden")) {
                                        g.setEmail("redaktion@eggenfelden.de");
                                    }

                                    String locationTitleCleaned = l.getTitle().toLowerCase()
                                            .replaceFirst("\\s*(?:, gkst|, m|, st)$", "")
                                            .replace("sankt", "st.")
                                            .replace(" an der ", " a. d. ")
                                            .replaceAll("\\.\\s+", ".");
                                    String gemeindeCleaned = g.getGemeinde().toLowerCase()
                                            .replace("verwaltungsgemeinschaft donau", "saal a.d. donau")
                                            .replace("verwaltungsgemeinschaft langquaid", "herrngiersdorf")
                                            .replace("verwaltungsgemeinschaft mainburg", "attenhofen")
                                            .replace("gemeinde mainburg", "volkenschwand")
                                            .replace("verwaltungsgemeinschaft schwarzach", "perasdorf")
                                            .replace("sankt", "st.")
                                            .replace("thurmannsbang", "thurmansbang")
                                            .replace("markt birnbach", "markt bad birnbach")
                                            .replace("/", " a. d. ")
                                            .replaceFirst("^(?:gemeinde|stadt|markt|verwaltungsgemeinschaft)\\s+", "")
                                            .replaceFirst("^(.+)\\s+vg.+", "$1")
                                            .replaceAll("\\.\\s+", ".");
                                    return l.getTitle().equals(g.getGemeinde())
                                            || locationTitleCleaned.equals(gemeindeCleaned)
                                            || (locationTitleCleaned + " (" + l.getLocationId() + ")").equals(gemeindeCleaned);
                                })
                                .map((l) -> {
                                    if (matchedCoordnateLocations.contains(l)) {
                                        return Location.builder()
                                                .title(g.getGemeinde())
                                                .duplicate(true)
                                                .build();
                                    }
                                    return l;
                                })
                                .peek(matchedCoordnateLocations::add)
                                .findAny()
                                .orElseGet(() -> {
                                    log.error("No location found for {} ({})", g.getGemeinde(), g.getLandkreis());
                                    withoutCoordinates.incrementAndGet();
                                    return Location.builder()
                                            .title(g.getGemeinde())
                                            .notFound(true)
                                            .build();
                                })
                ))
                .peek(gemeindeAndLocation -> {
                    int posterCount = gemeindeAndLocation.getPosterCount();
                    if (posterCount > 0) {
                        posterSum.addAndGet(posterCount);
                        posterLocationsCount.incrementAndGet();
                    }
                })
                .collect(Collectors.toList());

        log.info(
                "size: {} (gemeinden: {}; coordinates: {}; withoutCoordinates: {}; matchedCoordnateLocations: {})",
                data.size(),
                gemeinden.size(),
                coordinates.getLocations().size(),
                withoutCoordinates,
                matchedCoordnateLocations.size()
        );

        coordinates.getLocations().stream()
                .filter(location -> !matchedCoordnateLocations.contains(location))
                .forEach(location -> log.info("Unused coordinate location: {}", location.getTitle()));


    }

    private List<Gemeinde> getGemeinden() {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<Gemeinde> gemeinden = new ArrayList<>();

            gemeinden.addAll(objectMapper.readValue(getClass().getResource("/manuell/gemeinden.json"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Gemeinde.class)));

            gemeinden.addAll(objectMapper.readValue(getClass().getResource("/manuell/kreisfreie_staedte.json"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Gemeinde.class)));

            return gemeinden;
        } catch (IOException e) {
            throw new RuntimeException("error while reading json", e);
        }
    }

    private Coordinates getCoordinates() {
        try {
            JAXBContext jaxbContext = JAXBContext.newInstance(Coordinates.class);
            Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();

            return (Coordinates) unmarshaller.unmarshal(getClass().getResource("/manuell/coordinates.xml"));
        } catch (JAXBException e) {
            throw new RuntimeException("Error while reading xml!", e);
        }
    }

    @Getter
    public static class GemeindeAndLocation {
        private Gemeinde gemeinde;
        private Location location;
        private int posterCount;

        GemeindeAndLocation(Gemeinde gemeinde, Location location) {
            this.gemeinde = gemeinde;
            this.location = location;
            posterCount = calculatePosterCount();
        }

        private int calculatePosterCount() {
            if (location != null) {
                int einwohner = Integer.parseInt(location.getValue());
                if (einwohner < 3000) {
                    return 0;
                }
                float v = 1000F;
                if (einwohner > 60000) {
                    v = 1600F;
                } else if (einwohner > 40000) {
                    v = 1400F;
                } else if (einwohner > 20000) {
                    v = 1200F;
                }
                float maybeOdd = einwohner / v;
                return (int) Math.ceil(maybeOdd / 4) * 4;
            }
            return 0;
        }
    }

}
