package de.jr.postulator.postulator.controller;

import de.jr.postulator.postulator.service.ManuelleDatenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class UiController {

    private ManuelleDatenService manuelleDatenService;

    @Autowired
    public UiController(ManuelleDatenService manuelleDatenService) {
        this.manuelleDatenService = manuelleDatenService;
    }

    @GetMapping("/")
    public String index(Model model, @RequestParam(required = false, defaultValue = "false") boolean filtered) {

        List<ManuelleDatenService.GemeindeAndLocation> data = manuelleDatenService.getData();
        if (filtered) {
            data = data.stream()
                    .filter(gal -> gal.getPosterCount() > 0)
                    .collect(Collectors.toList());
        }
        model.addAttribute("filtered", filtered);
        model.addAttribute("data", data);
        model.addAttribute("posterSum", manuelleDatenService.getPosterSum());
        model.addAttribute("posterLocationsCount", manuelleDatenService.getPosterLocationsCount());

        return "index";
    }

    @GetMapping("/map")
    public String map(Model model) {

        model.addAttribute("data", manuelleDatenService.getData());
        model.addAttribute("posterSum", manuelleDatenService.getPosterSum());
        model.addAttribute("posterLocationsCount", manuelleDatenService.getPosterLocationsCount());

        return "map";
    }

}
